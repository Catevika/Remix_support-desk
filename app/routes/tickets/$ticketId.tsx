import type { LoaderFunction, ActionFunction, MetaFunction } from 'remix';
import type { Ticket/* , Product, Status */ } from '@prisma/client';
import {
  Link,
  json,
  useLoaderData,
  useCatch,
  redirect,
  useParams
} from 'remix';
import { db } from '~/utils/db.server';
import { requireUserId } from '~/utils/session.server';
import { TicketDisplay } from '~/components/TicketDisplay';

// TODO: Insérer le goTo Login ici

export const meta: MetaFunction = ({
  data
}: {
  data: LoaderData | undefined;
}) => {
  if (!data) {
    return {
      title: 'No ticket',
      description: 'No ticket found'
    };
  }
  return {
    title: `${data.ticket}`,
    description: `Here ist the "${data.ticket}"created by ${data.username}`
  };
};

type LoaderData = {
  id: string;
  username: string;
  ticket: Ticket;
  device: string;
  type: string;
  isOwner: boolean;
  canDelete: boolean;
};

export const loader: LoaderFunction = async ({ params }) => {
  const ticket = await db.ticket.findUnique({
    where: { ticketId: params.ticketId }
  });


  const product = await db.product.findUnique({
    where: { productId: ticket?.ticketProductId },
    select: { device: true }
  });

  const status = await db.status.findUnique({
    where: { statusId: ticket?.ticketStatusId },
    select: { type: true }
  });

  if (!ticket) {
    throw new Response('Ticket Not Found.', {
      status: 404
    });
  }

  if (!product) {
    throw new Response('Product Not Found.', {
      status: 404
    });
  }

  if (!status) {
    throw new Response('Status Not Found.', {
      status: 404
    });
  }

  const user = await db.user.findUnique({
    where: { id: ticket.authorId },
    select: { id: true, username: true }
  });

  if (!user) {
    throw new Response('User Not Found.', {
      status: 404
    });
  }

  const data: LoaderData = {
    id: user.id,
    username: user.username,
    ticket,
    device: product.device,
    type: status.type,
    isOwner: user.id === ticket.authorId,
    canDelete: true
  };
  return json(data);
};

export const action: ActionFunction = async ({ request, params }) => {
  const form = await request.formData();
  if (form.get('_method') !== 'delete') {
    throw new Response(`The _method ${form.get('_method')} is not supported`, {
      status: 400
    });
  }
  const userId = await requireUserId(request);
  const ticket = await db.ticket.findUnique({
    where: { ticketId: params.ticketId }
  });

  if (!ticket) {
    throw new Response("Can't delete what does not exist", {
      status: 404
    });
  }
  if (ticket.authorId !== userId) {
    throw new Response("Can't delete a ticket that is not yours", {
      status: 401
    });
  }
  await db.ticket.delete({ where: { ticketId: params.ticketId } });
  return redirect('/tickets/new-ticket');
};

export default function TicketRoute() {
  const data = useLoaderData<LoaderData>();

  return (
    <>
      <main className='form-container'>
        {data.username && (
          <p>
            Ticket created by{' '}
            <span className='capitalize'>{data.username}</span>
          </p>
        )}
        <div className='form-content'>
          <TicketDisplay
            ticket={data.ticket}
            device={data.device}
            type={data.type}
            isOwner={data.isOwner}
            canDelete={data.canDelete}
          />
        </div>
        <Link to='/tickets/new-ticket'>
          <button className='btn form-btn'>Back to Create Ticket</button>
        </Link>
      </main>
    </>
  );
}

export function CatchBoundary() {
  const caught = useCatch();
  const params = useParams();
  switch (caught.status) {
    case 400: {
      return (
        <div className='error-container'>
          <div className='form-container form-content'>
            What you're trying to do is not allowed.
          </div>
        </div>
      );
    }
    case 404: {
      return (
        <div className='error-container'>
          <div className='form-container form-content'>
            {params.productId} does not exist.
          </div>
        </div>
      );
    }
    case 401: {
      return (
        <div className='error-container'>
          <div className='form-container form-content'>
            Sorry, but {params.productId} is not your product.
          </div>
        </div>
      );
    }
    default: {
      throw new Error(`Unhandled error: ${caught.status}`);
    }
  }
}

export function ErrorBoundary({ error }: { error: Error; }) {
  console.error(error);
  const { productId } = useParams();
  return (
    <div className='error-container'>
      <div className='form-container form-content'>
        There was an error loading the product by the id:{' '}
        <p>
          {' '}
          <span>{`${productId}.`}</span>
        </p>
        <p>Sorry.</p>
      </div>
    </div>
  );
}
